import { Carousel } from 'flowbite-react';
import React from 'react';

interface Props {
  data: (string | { alt: string; src: string })[];
  height?: string | number;
}

export default function FlowbiteCarousel(props: Props) {
  return (
    <Carousel>
      {props.data.map((strObj, i) => {
        const alt = typeof strObj === 'object' ? strObj.alt : strObj;
        const src = typeof strObj === 'object' ? strObj.src : strObj;
        return <img alt={alt} src={src} height={String(props.height)} key={alt + src + i} />;
      })}
    </Carousel>
  );
}
