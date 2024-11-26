export const isPublic = (obj, fields) => {
  for (let i = 0; i < fields.length; i++) {
    if (!obj[`${fields[i]}`].public) {
      obj[`${fields[i]}`] = null;
    }
  }
};
