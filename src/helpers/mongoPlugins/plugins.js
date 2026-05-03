export function addTimestampsPlugin(schema) {
  schema.set('timestamps', true);
}

export function globalToJSONPlugin(schema) {
  const options = schema.get('toJSON') || {};
  schema.set('toJSON', {
    ...options,
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      if (options.transform) {
        return options.transform(doc, ret);
      }
      return ret;
    },
  });
}
