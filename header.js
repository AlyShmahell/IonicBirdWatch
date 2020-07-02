$(document).ready(function () {
    var textWrapper = document.querySelector(".ml2");
    textWrapper.innerHTML = textWrapper.textContent.replace(
        /\S/g,
        "<span class='letter'>$&</span>"
    );
    anime
        .timeline({ loop: true })
        .add({
            targets: ".ml2 .letter",
            scale: [4, 1],
            opacity: [0, 1],
            translateZ: 0,
            easing: "easeOutExpo",
            duration: 950,
            delay: (el, i) => 70 * i,
        })
        .add({
            targets: ".ml2",
            opacity: 0,
            duration: 1000,
            easing: "easeOutExpo",
            delay: 10000,
        });
    var daterange = $("#daterange")[0];
    noUiSlider.create(daterange, {
        start: [20, 80],
        tooltips: [wNumb({ decimals: 1 }), true],
        connect: true,
        range: {
            min: 0,
            max: 100,
        },
    });
});