// Custom variable 
cameraStartPosition = null;

$(document).on('mouseup', function(event) {
  if (!$(event.target).closest('#container').length ) {
      $("#container, #help, #licensing").css("display", "none"); 
  }
});

$( window ).ready(function() {
    var signals = editor.signals;
    signals.showGridChanged.dispatch(false);
});