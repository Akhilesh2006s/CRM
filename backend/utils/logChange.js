const { AsyncLocalStorage } = require('async_hooks');

const actorStore = new AsyncLocalStorage();

function runWithActor(user, callback) {
  return actorStore.run({ user }, callback);
}

function currentActor() {
  const user = actorStore.getStore()?.user;
  if (!user) return {};
  return {
    actorName: user.name || '',
    actorEmail: user.email || '',
    actorId: user._id,
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
    };
    ChangeLog.create(payload).catch((err) => {
      console.warn('ChangeLog write skipped:', err?.message);
    });
  } catch (err) {
    console.warn('ChangeLog write skipped:', err?.message);
  }
}

module.exports = { logChange, runWithActor };
