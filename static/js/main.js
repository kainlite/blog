/**
 * Created by fabiomadeira on 25/02/15.
 */
// jQuery for page scrolling feature
jQuery(document).ready(function (e) {
  e(".scroll").click(function (t) {
    t.preventDefault();
    e("html,body").animate(
      {
        scrollTop: e(this.hash).offset().top,
      },
      1e3
    );
  });

  $(function () {
    $("img").on("click", function () {
      $(".enlargeImageModalSource").attr("src", $(this).attr("src"));
      $("#enlargeImageModal").modal("show");
    });
  });

  document.getElementById("consent-overlay").classList.toggle("active");
});
