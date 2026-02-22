"use client";

import { Rating } from "react-simple-star-rating";

interface FractionalStarsProps {
  rating: number;
  size?: number;
}

export function FractionalStars({ rating, size = 16 }: FractionalStarsProps) {
  return (
    <Rating
      readonly
      allowFraction
      initialValue={rating}
      size={size}
      fillColor="#facc15"
      emptyColor="#d1d5db"
      SVGstyle={{ display: "inline-block" }}
    />
  );
}

