import dotenv from "dotenv";
import connectDatabase from "./src/config/db.js";
import Crypto from "./src/models/Crypto.js";

dotenv.config();

const cryptoData = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: 63980.21,
    image: "https://assets.coincap.io/assets/icons/btc@2x.png",
    change24h: 2.82
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: 3184.42,
    image: "https://assets.coincap.io/assets/icons/eth@2x.png",
    change24h: 4.12
  },
  {
    name: "Solana",
    symbol: "SOL",
    price: 147.93,
    image: "https://assets.coincap.io/assets/icons/sol@2x.png",
    change24h: 8.44
  },
  {
    name: "Cardano",
    symbol: "ADA",
    price: 0.48,
    image: "https://assets.coincap.io/assets/icons/ada@2x.png",
    change24h: -1.32
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    price: 14.71,
    image: "https://assets.coincap.io/assets/icons/link@2x.png",
    change24h: 5.26
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    price: 35.64,
    image: "https://assets.coincap.io/assets/icons/avax@2x.png",
    change24h: 1.91
  },
  {
    name: "Render",
    symbol: "RNDR",
    price: 8.87,
    image: "https://assets.coincap.io/assets/icons/rndr@2x.png",
    change24h: 11.03
  }
];

async function seed() {
  await connectDatabase();
  await Crypto.deleteMany({});
  await Crypto.insertMany(cryptoData);
  console.log(`Seeded ${cryptoData.length} cryptocurrencies`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
