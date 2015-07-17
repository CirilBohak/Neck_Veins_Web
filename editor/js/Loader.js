/**
 * @author mrdoob / http://mrdoob.com/
 */

var Loader = function ( editor ) {

	var scope = this;
	var signals = editor.signals;

	this.loadFile = function ( file ) {

		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();

		switch ( extension ) {

			case 'awd':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var loader = new THREE.AWDLoader();
					var scene = loader.parse( event.target.result );

					editor.setScene( scene );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'babylon':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();
					var scene = loader.parse( json );

					editor.setScene( scene );

				}, false );
				reader.readAsText( file );

				break;

			case 'babylonmeshdata':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();

					var geometry = loader.parseGeometry( json );
					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'ctm':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var data = new Uint8Array( event.target.result );

					var stream = new CTM.Stream( data );
					stream.offset = 0;

					var loader = new THREE.CTMLoader();
					loader.createModel( new CTM.File( stream ), function( geometry ) {

						geometry.sourceType = "ctm";
						geometry.sourceFile = file.name;

						var material = new THREE.MeshPhongMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.addObject( mesh );
						editor.select( mesh );

					} );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'dae':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var parser = new DOMParser();
					var xml = parser.parseFromString( contents, 'text/xml' );

					var loader = new THREE.ColladaLoader();
					loader.parse( xml, function ( collada ) {

						collada.scene.name = filename;

						editor.addObject( collada.scene );
						editor.select( collada.scene );

					} );

				}, false );
				reader.readAsText( file );

				break;

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					// 2.0

					if ( contents.indexOf( 'postMessage' ) !== -1 ) {

						var blob = new Blob( [ contents ], { type: 'text/javascript' } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data, file, filename );

						};

						worker.postMessage( Date.now() );

						return;

					}

					// >= 3.0

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data, file, filename );

				}, false );
				reader.readAsText( file );

				break;

			case 'obj':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
                    
					var object = new THREE.OBJLoader().parse( contents );
                    
                    var vertexAvgX = 0, 
                        vertexAvgY = 0, 
                        vertexAvgZ = 0;
                    
                    // Get mesh and add color to the mesh
                    
                    object.traverse(function(child){
                        if(child instanceof THREE.Mesh){
                            child.material.color.setRGB(1,0,0);
                            child.material.side = THREE.BackSide;
                        }
                        
                        if(child.geometry !== undefined){
                            var geometry = child.geometry;
                            var vertices = geometry.attributes.position.array;
                            //geometry.computeVertexNormals();
                            for(ij = 0; ij < geometry.attributes.normal.array.length; ij++){
                                geometry.attributes.normal.array[ij] = -geometry.attributes.normal.array[ij];
                            }
                            
                            
                            
                            //console.log(normals);
                            for(var i = 0; i < vertices.length; i = i + 3){
                                //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
                                vertexAvgX = vertexAvgX + vertices[i];
                                vertexAvgY = vertexAvgY + vertices[i+1];
                                vertexAvgZ = vertexAvgZ + vertices[i+2];
                                
                            }
                            vertexAvgX = Math.round(vertexAvgX / (vertices.length / 3) * 10) / 10;
                            vertexAvgY = Math.round(vertexAvgY / (vertices.length / 3) * 10) / 10;
                            vertexAvgZ = Math.round(vertexAvgZ / (vertices.length / 3) * 10) / 10;
                            //console.log(vertexAvgX + " " + vertexAvgY + " " + vertexAvgZ);
                            
                            
                            
                            geometry.attributes.position.needsUpdate = true;
                            for(var i = 0; i < vertices.length; i = i + 3){
                                //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
                                vertices[i] = vertices[i] - vertexAvgX;
                                vertices[i+1] = vertices[i+1] - vertexAvgY;
                                vertices[i+2] = vertices[i+2] - vertexAvgZ;
                            }

                        }
                        
                    });
                    
					object.name = filename;
					editor.addObject( object );
					//editor.select( object );
                    
                    var light = new THREE.PointLight( 0xffffff, 1, 0 ); 
                    // color, intensity, distance
                    light.name = 'InitPointLight';
                    light.position.set(editor.camera.position.x, editor.camera.position.y, editor.camera.position.z);
                    editor.addObject( light );
                    editor.camera.lookAt(new THREE.Vector3(0,0,0));
                    //console.log("camera position: x = " + editor.camera.position.x + "; y = " + editor.camera.position.y + "; z = " + editor.camera.position.z);
                    

				}, false );
				reader.readAsText( file );

				break;

			case 'ply':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.PLYLoader().parse( contents );
					geometry.sourceType = "ply";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'stl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.STLLoader().parse( contents );
					geometry.sourceType = "stl";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );

				if ( reader.readAsBinaryString !== undefined ) {

					reader.readAsBinaryString( file );

				} else {

					reader.readAsArrayBuffer( file );

				}

				break;

			/*
			case 'utf8':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.UTF8Loader().parse( contents );
					var material = new THREE.MeshLambertMaterial();

					var mesh = new THREE.Mesh( geometry, material );

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsBinaryString( file );

				break;
			*/

			case 'vtk':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.VTKLoader().parse( contents );
					geometry.sourceType = "vtk";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'wrl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var result = new THREE.VRMLLoader().parse( contents );

					editor.setScene( result );

				}, false );
				reader.readAsText( file );

				break;

			default:

				alert( 'Unsupported file format (' + extension +  ').' );

				break;

		}

	}

	var handleJSON = function ( data, file, filename ) {

		if ( data.metadata === undefined ) { // 2.0

			data.metadata = { type: 'Geometry' };

		}

		if ( data.metadata.type === undefined ) { // 3.0

			data.metadata.type = 'Geometry';

		}

		if ( data.metadata.version === undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

		if ( data.metadata.type === 'BufferGeometry' ) {

			var loader = new THREE.BufferGeometryLoader();
			var result = loader.parse( data );

			var mesh = new THREE.Mesh( result );

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'geometry' ) {

			var loader = new THREE.JSONLoader();
			var result = loader.parse( data );

			var geometry = result.geometry;
			var material;

			if ( result.materials !== undefined ) {

				if ( result.materials.length > 1 ) {

					material = new THREE.MeshFaceMaterial( result.materials );

				} else {

					material = result.materials[ 0 ];

				}

			} else {

				material = new THREE.MeshPhongMaterial();

			}

			geometry.sourceType = "ascii";
			geometry.sourceFile = file.name;

			var mesh;

			if ( geometry.animation && geometry.animation.hierarchy ) {

				mesh = new THREE.SkinnedMesh( geometry, material );

			} else {

				mesh = new THREE.Mesh( geometry, material );

			}

			mesh.name = filename;

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'object' ) {

			var loader = new THREE.ObjectLoader();
			var result = loader.parse( data );

			if ( result instanceof THREE.Scene ) {

				editor.setScene( result );

			} else {

				editor.addObject( result );
				editor.select( result );

			}

		} else if ( data.metadata.type.toLowerCase() === 'scene' ) {

			// DEPRECATED

			var loader = new THREE.SceneLoader();
			loader.parse( data, function ( result ) {

				editor.setScene( result.scene );

			}, '' );

		}

	};

}
