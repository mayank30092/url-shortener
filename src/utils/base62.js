const CHARACTERS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const encodedBase62 = (number) => {
  if (number == 0) return "0";
  let result = "";
  while (number > 0) {
    const remainder = number % 62;
    result = CHARACTERS[remainder] + result;
    number = Math.floor(number / 62);
  }
  return result;
};

module.exports = { encodedBase62 };
