const uuidRegExp = new RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gm);

export default (test: unknown): boolean => {
  if (typeof test !== 'string') return false;
  return uuidRegExp.test(test);
};