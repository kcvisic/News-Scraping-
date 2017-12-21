
$(function(){
  $("#scrapeBtn").on("click", function() {
    $.ajax({
        method: "GET",
        url: "/scrape",
      })
      .done(function() {
        location.reload();
      })

  })


})





function handleCommentSubmit(_id) {
  $.ajax({
      method: "POST",
      url: "/comments/" + _id,
      data: {
        body: $("#" + _id).val().trim()
      }
    })
    .done(function(data) {
      console.log(data)
    });
  $("#comments").val("");

};
