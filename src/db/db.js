const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Database = require('better-sqlite3');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'cheques.db');
const db = new Database(dbPath);

// Crear tabla de bancos
db.prepare(`
  CREATE TABLE IF NOT EXISTS bancos (
    nombreBanco TEXT PRIMARY KEY,
    beneficiarioX INTEGER,
    beneficiarioY INTEGER,
    montoX INTEGER,
    montoY INTEGER,
    montoLetrasX INTEGER,
    montoLetrasY INTEGER,
    fechaX INTEGER,
    fechaY INTEGER
  )
`).run();

// Crear tabla de historial
db.prepare(`
  CREATE TABLE IF NOT EXISTS historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    noCheque TEXT,
    beneficiario TEXT,
    monto TEXT,
    montoLetras TEXT,
    lugar TEXT,
    fecha TEXT,
    banco TEXT,
    fechaGuardado TEXT
  )
`).run();

function obtenerConfiguraciones() {
  return db.prepare('SELECT * FROM bancos').all();
}

function guardarConfiguracionBanco(config) {
  try {
    return db.prepare(`
      INSERT OR REPLACE INTO bancos (
        nombreBanco,
        beneficiarioX, beneficiarioY,
        montoX, montoY,
        montoLetrasX, montoLetrasY,
        fechaX, fechaY
      ) VALUES (
        @nombreBanco,
        @beneficiarioX, @beneficiarioY,
        @montoX, @montoY,
        @montoLetrasX, @montoLetrasY,
        @fechaX, @fechaY
      )
    `).run(config);
  } catch (error) {
    console.error('Error guardando configuración banco:', error);
    throw error;
  }
}

function guardarHistorialCheque(cheque) {
  try {
    return db.prepare(`
      INSERT INTO historial (
        noCheque, beneficiario, monto, montoLetras,
        lugar, fecha, banco, fechaGuardado
      ) VALUES (
        @noCheque, @beneficiario, @monto, @montoLetras,
        @lugar, @fecha, @banco, @fechaGuardado
      )
    `).run(cheque);
  } catch (error) {
    console.error('Error guardando historial de cheque:', error);
    throw error;
  }
}

function obtenerHistorial() {
  return db.prepare('SELECT * FROM historial ORDER BY fechaGuardado DESC').all();
}

function actualizarHistorial(historialNuevo) {
  try {
    const del = db.prepare('DELETE FROM historial');
    const ins = db.prepare(`
      INSERT INTO historial (
        noCheque, beneficiario, monto, montoLetras,
        lugar, fecha, banco, fechaGuardado
      ) VALUES (
        @noCheque, @beneficiario, @monto, @montoLetras,
        @lugar, @fecha, @banco, @fechaGuardado
      )
    `);

    const transaction = db.transaction((historial) => {
      del.run();
      historial.forEach(h => ins.run(h));
    });

    transaction(historialNuevo);
    return true;
  } catch (error) {
    console.error('Error actualizando historial:', error);
    throw error;
  }
}

function buscarHistorial(filtros) {
  let sql = `SELECT * FROM historial WHERE 1=1`;
  const params = [];

  if (filtros.tipo === 'banco' && filtros.valor) {
    sql += ` AND banco = ?`;
    params.push(filtros.valor);
  }

  if (filtros.tipo === 'cliente' && filtros.valor) {
    sql += ` AND beneficiario = ?`;
    params.push(filtros.valor);
  }

  if (filtros.tipo === 'rango' && filtros.fechaInicio && filtros.fechaFin) {
    sql += ` AND DATE(fechaGuardado) BETWEEN ? AND ?`;
    params.push(filtros.fechaInicio, filtros.fechaFin);
  }

  const stmt = db.prepare(sql);
  return stmt.all(params);
}

function eliminarChequePorId(id) {
  return db.prepare('DELETE FROM historial WHERE id = ?').run(id);
}

function obtenerChequePorId(id) {
  return db.prepare('SELECT * FROM historial WHERE id = ?').get(id);
}

function obtenerBancos() {
  const stmt = db.prepare('SELECT * FROM bancos');
  return stmt.all();
}

function actualizarChequePorId(id, datos) {
  const {
    noCheque,
    beneficiario,
    monto,
    montoLetras,
    lugar,
    fecha,
    banco,
  } = datos;
  const stmt = db.prepare(`
    UPDATE historial
    SET noCheque = @noCheque,
        beneficiario = @beneficiario,
        monto = @monto,
        montoLetras = @montoLetras,
        lugar = @lugar,
        fecha = @fecha,
        banco = @banco
    WHERE id = @id
  `);
  return stmt.run({ id, noCheque, beneficiario, monto, montoLetras, lugar, fecha, banco });
}

module.exports = {
  db,
  obtenerConfiguraciones,
  guardarConfiguracionBanco,
  guardarHistorialCheque,
  obtenerHistorial,
  actualizarHistorial,
  buscarHistorial,
  eliminarChequePorId,
  obtenerChequePorId,
  obtenerBancos,
  actualizarChequePorId,
};
