const { logChange } = require('./logChange');

const SKIP_ROOT = new Set([
  'password',
  '__v',
  'updatedAt',
  'createdAt',
  'lastLogin',
  'token',
  'refreshToken',
  'otp',
  'otpExpires',
  'resetOtpHash',
  'resetOtpExpires',
  'boundDeviceId',
  'boundDeviceAt',
]);

function pickPathValues(doc, paths) {
  if (!doc || !paths?.length) return {};
  const out = {};
  for (const path of paths) {
    const root = String(path).split('.')[0];
    if (SKIP_ROOT.has(root)) continue;
    try {
      const val = doc[path] !== undefined ? doc[path] : doc[root];
      if (val !== undefined) out[path] = val;
    } catch (_) {
      /* ignore */
    }
  }
  return out;
}

function sanitizeValues(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const root = String(k).split('.')[0];
    if (SKIP_ROOT.has(root)) continue;
    if (v === undefined) continue;
    try {
      // Drop huge blobs / buffers
      if (Buffer.isBuffer(v)) continue;
      if (typeof v === 'string' && v.length > 2000) {
        out[k] = `${v.slice(0, 2000)}…`;
      } else {
        out[k] = v;
      }
    } catch (_) {
      /* ignore */
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function attachChangeLog(schema, entityType) {
  if (!schema || schema._changeLogAttached) return;
  schema._changeLogAttached = true;

  schema.post('init', function (doc) {
    try {
      if (doc && !doc.$locals) doc.$locals = {};
      if (doc) doc.$locals._changeLogOriginal = doc.toObject({ depopulate: true });
    } catch (_) {
      /* ignore */
    }
  });

  schema.pre('save', function (next) {
    try {
      const paths = (this.modifiedPaths() || []).filter((p) => !SKIP_ROOT.has(String(p).split('.')[0]));
      const previousValues = {};
      const newValues = {};
      const original = this.$locals?._changeLogOriginal;
      if (!this.isNew && original && paths.length) {
        for (const path of paths) {
          const root = String(path).split('.')[0];
          if (Object.prototype.hasOwnProperty.call(original, path)) {
            previousValues[path] = original[path];
          } else if (Object.prototype.hasOwnProperty.call(original, root)) {
            previousValues[path] = original[root];
          }
          try {
            newValues[path] = this.get(path);
          } catch (_) {
            /* ignore */
          }
        }
      } else if (this.isNew && paths.length) {
        for (const path of paths) {
          try {
            newValues[path] = this.get(path);
          } catch (_) {
            /* ignore */
          }
        }
      }
      this.$locals._changeLog = {
        wasNew: this.isNew,
        paths,
        previousValues: sanitizeValues(previousValues),
        newValues: sanitizeValues(newValues),
      };
    } catch (_) {
      /* ignore */
    }
    next();
  });

  schema.post('save', function (doc) {
    try {
      const meta = this.$locals?._changeLog || {};
      if (!meta.wasNew && (!meta.paths || meta.paths.length === 0)) return;
      const action = meta.wasNew ? 'create' : 'update';
      setImmediate(() => {
        logChange({
          entityType,
          entityId: doc?._id,
          action,
          fields: meta.paths || [],
          summary: `${entityType} ${action}d`,
          previousValues: meta.previousValues,
          newValues: meta.newValues,
        });
      });
    } catch (_) {
      /* never fail the save */
    }
  });

  schema.pre('findOneAndUpdate', async function () {
    try {
      const prev = await this.model.findOne(this.getQuery()).lean();
      this._changeLogPrevious = prev || null;
    } catch (_) {
      this._changeLogPrevious = null;
    }
  });

  schema.post('findOneAndUpdate', function (doc) {
    try {
      const id = doc?._id || this.getQuery?.()?._id;
      if (!id) return;
      const update = this.getUpdate?.() || {};
      const set = { ...(update.$set || {}), ...Object.fromEntries(Object.entries(update).filter(([k]) => !k.startsWith('$'))) };
      const paths = Object.keys(set).filter((p) => !SKIP_ROOT.has(String(p).split('.')[0]));
      const previousValues = sanitizeValues(pickPathValues(this._changeLogPrevious, paths));
      const newValues = sanitizeValues(pickPathValues({ ...set }, paths));
      setImmediate(() => {
        logChange({
          entityType,
          entityId: id,
          action: 'update',
          fields: paths.slice(0, 40),
          summary: `${entityType} updated`,
          previousValues,
          newValues,
        });
      });
    } catch (_) {
      /* ignore */
    }
  });

  schema.post('findOneAndDelete', function (doc) {
    try {
      const id = doc?._id || this.getQuery?.()?._id;
      if (!id) return;
      let previousValues;
      try {
        previousValues = sanitizeValues(doc?.toObject ? doc.toObject({ depopulate: true }) : doc);
      } catch (_) {
        previousValues = undefined;
      }
      setImmediate(() => {
        logChange({
          entityType,
          entityId: id,
          action: 'delete',
          summary: `${entityType} deleted`,
          previousValues,
        });
      });
    } catch (_) {
      /* ignore */
    }
  });
}

module.exports = { attachChangeLog };
