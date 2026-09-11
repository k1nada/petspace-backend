const containsId = (list, id) => {
  for (const item of list) {
    if (item.toString() === id.toString()) return true;
  }
  return false;
};

module.exports = { containsId };
