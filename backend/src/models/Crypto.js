import mongoose from "mongoose";

const cryptoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Crypto name is required"],
      trim: true
    },
    symbol: {
      type: String,
      required: [true, "Crypto symbol is required"],
      uppercase: true,
      trim: true,
      unique: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"]
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true
    },
    change24h: {
      type: Number,
      required: [true, "24h change is required"]
    }
  },
  { timestamps: true }
);

const Crypto = mongoose.model("Crypto", cryptoSchema);

export default Crypto;
