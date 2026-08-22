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
]);

function attachChangeLog(schema, entityType) {
  if (!schema || schema._changeLogAttached) return;
  schema._changeLogAttached = true;

  schema.pre('save', function (next) {
    try {
      const paths = (this.modifiedPaths() || []).filter((p) => !SKIP_ROOT.has(String(p).split('.')[0]));
      this.$locals._changeLog = {
        wasNew: this.isNew,
        paths,
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
        });
      });
    } catch (_) {
      /* never fail the save */
    }
  });

  schema.post('findOneAndUpdate', function (doc) {
    try {
      const id = doc?._id || this.getQuery?.()?._id;
      if (!id) return;
      setImmediate(() => {
        logChange({
          entityType,
          entityId: id,
          action: 'update',
          summary: `${entityType} updated`,
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
      setImmediate(() => {
        logChange({
          entityType,
          entityId: id,
          action: 'delete',
          summary: `${entityType} deleted`,
        });
      });
    } catch (_) {
      /* ignore */
    }
  });
}

module.exports = { attachChangeLog };
