export const formatAddress = (address: string): string => {
  const str_1 = address.substring(0, 4);
  const str_2 = address.substring(address.length - 4);
  return `${str_1}......${str_2}`;
};

