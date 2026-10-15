import React from 'react';
import { BrandLoading } from '@/components/BrandLoading';

export default function Loading() {
  return (
    <BrandLoading
      size="fullscreen"
      text="Loading ITV Broadcast Infrastructure..."
      subtext="Independent Television • IT Operations Platform"
    />
  );
}
