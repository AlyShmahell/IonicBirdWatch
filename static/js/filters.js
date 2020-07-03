$(document).ready(function () {
    daterange.noUiSlider.on("update", function (values, handle) {
        $("#daterange_n" + handle).remove();
        var r = $(
            '<input name="daterange_n' +
            handle +
            '" id="daterange_n' +
            handle +
            '" type="text" hidden/>'
        );
        $("#filters").append(r);
        $("#daterange_n" + handle).val(values[handle]);
    });
    $(".search").attr("form", "filters");
    $(".search").attr("name", "search");
    $(".search").on("keypress", function (e) {
        if (e.which == 13) {
            $("#filters").submit();
        }
    });
    $("#filters").on("submit", function (event) {
        event.preventDefault();
        console.log($("#filters").serialize());
    });
});