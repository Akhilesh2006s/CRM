const { AsyncLocalStorage } = require('async_hooks');

const actorStore = new AsyncLocalStorage();

/**
 * Run a request handler with the acting user (and optional request meta) in ALS.
 * @param {object} user
 * @param {Function} callback
 * @param {{ ipAddress?: string, ip?: string, userAgent?: string }} [meta]
 */
function runWithActor(user, callback, meta = {}) {
  return actorStore.run(
    {
      user,
      ipAddress: meta.ipAddress || meta.ip || '',
      userAgent: meta.userAgent || '',
    },
    callback
  );
}

function currentActor() {
  const store = actorStore.getStore() || {};
  const user = store.user;
  if (!user) {
    return {
      ipAddress: store.ipAddress || '',
      userAgent: store.userAgent || '',
    };
  }
  return {
    actorName: user.name || '',
    actorEmail: user.email || '',
    actorId: user._id,
    ipAddress: store.ipAddress || '',
    userAgent: store.userAgent || '',
  };
}

/**
 * Fire-and-forget audit write. Must never throw into the caller.
 */
function logChange(entry) {
  try {
    const ChangeLog = require('../models/ChangeLog');
    const actor = currentActor();
    const payload = {
      entityType: String(entry?.entityType || 'Unknown').trim() || 'Unknown',
      entityId: entry?.entityId || undefined,
      action: ['create', 'update', 'delete'].includes(entry?.action) ? entry.action : 'update',
      summary: String(entry?.summary || '').slice(0, 500),
      fields: Array.isArray(entry?.fields) ? entry.fields.slice(0, 40) : [],
      actorName: String(entry?.actorName || actor.actorName || '').slice(0, 120),
      actorEmail: String(entry?.actorEmail || actor.actorEmail || '').slice(0, 120),
      actorId: entry?.actorId || actor.actorId || undefined,
      ipAddress: String(entry?.ipAddress || actor.ipAddress || '').slice(0, 120),
      userAgent: String(entry?.userAgent || actor.userAgent || '').slice(0, 500),
      previousValues: entry?.previousValues && typeof entry.previousValues === 'object' ? entry.previousValues : undefined,
      newValues: entry?.newValues && typeof entry.newValues === 'object' ? entry.newValues : undefined,
    };
    ChangeLog.create(payload).catch((err) => {
      console.warn('ChangeLog write skipped:', err?.message);
    });
  } catch (err) {
    console.warn('ChangeLog write skipped:', err?.message);
  }
}

module.exports = { logChange, runWithActor };
