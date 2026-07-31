export function getSellingPrice(cost: number, volume: number) {
  const wholesale = cost / 10000; // Convert API price to USD
  const gb = Math.round(volume / 1024 / 1024 / 1024);

  let addPrice = 0;

  switch (gb) {
    case 1:
      addPrice = 1;
      break;

    case 3:
      addPrice = 2;
      break;

    case 5:
      addPrice = 2;
      break;

    case 10:
      addPrice = 3;
      break;

    case 20:
      addPrice = 3;
      break;

    case 30:
      addPrice = 3.5;
      break;

    case 50:
      addPrice = 4;
      break;

    default:
      addPrice = 5;
  }

  return (wholesale + addPrice).toFixed(2);
}