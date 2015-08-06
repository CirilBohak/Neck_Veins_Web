Menubar.Camera = function ( editor ) {

	var container = new UI.Panel();
	container.setClass( 'menu' );

	var title = new UI.Panel();
	title.setClass( 'title' );
	title.setTextContent( 'Camera' );
    
    container.onClick(function(){
    });
    
	container.add( title );

	var options = new UI.Panel();
	options.setClass( 'options' );
	container.add( options );

	// Source code

	var option = new UI.Panel();
	option.setClass( 'option' );
	option.setTextContent( 'reset' );
	option.onClick( function () {
        if(typeof sceneObject === 'undefined'){
            alert("Please import an object first.");
        }
        else{
            var signals = editor.signals;
            signals.cameraReset.dispatch();
        }
	} );
	options.add( option );

	// About

	/*var option = new UI.Panel();
	option.setClass( 'option' );
	option.setTextContent( 'About' );
	option.onClick( function () {

		window.open( 'http://threejs.org', '_blank' );

	} );
	options.add( option );*/

	return container;

};