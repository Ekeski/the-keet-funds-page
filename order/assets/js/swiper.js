const swiperEl = document.querySelector("swiper-container");

        const params = {
            centeredSlides: false,
            slidesPerGroupSkip: 1,
            grabCursor: true,
            keyboard: {
                enabled: true,
            },
            breakpoints: {
                769: {
                    slidesPerView: 2,
                    slidesPerGroup: 2,
                },
            },
            scrollbar: true,
            navigation: true,
            pagination: {
                clickable: true,
            },
        };

        Object.assign(swiperEl, params);

        swiperEl.initialize();