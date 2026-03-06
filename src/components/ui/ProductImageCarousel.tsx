import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Icon from './Icon';

interface ProductImageCarouselProps {
    images: string[];
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({ images }) => {
    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center relative bg-cover bg-center">
                <Icon name="image" className="text-5xl text-gray-400" />
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <div
                className="w-full aspect-square bg-gray-100 flex items-center justify-center relative bg-cover bg-center"
                style={{ backgroundImage: `url(${images[0]})` }}
            />
        );
    }

    return (
        <div className="w-full aspect-square relative bg-white">
            <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true, dynamicBullets: true }}
                className="w-full h-full"
            >
                {images.map((img, index) => (
                    <SwiperSlide key={index}>
                        <div
                            className="w-full h-full bg-cover bg-center bg-gray-100"
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom generic CSS override for Swiper bullet colors so they match brand */}
            <style>{`
                .swiper-pagination-bullet-active {
                    background-color: #0A0A0A !important;
                }
            `}</style>
        </div>
    );
};

export default ProductImageCarousel;
