/**
 * @author tschw
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 */

var AnimationUtils = {

		// same as Array.prototype.slice, but also works on typed arrays
		arraySlice: function ( array, from, to ) {

			if ( AnimationUtils.isTypedArray( array ) ) {

				// in ios9 array.subarray(from, undefined) will return empty array
				// but array.subarray(from) or array.subarray(from, len) is correct
				return new array.constructor( array.subarray( from, to !== undefined ? to : array.length ) );

			}

			return array.slice( from, to );

		},

		// converts an array to a specific type
		convertArray: function ( array, type, forceClone ) {

			if ( ! array || // let 'undefined' and 'null' pass
					! forceClone && array.constructor === type ) return array;

			if ( typeof type.BYTES_PER_ELEMENT === 'number' ) {

				return new type( array ); // create typed array

			}

			return Array.prototype.slice.call( array ); // create Array

		},

		isTypedArray: function ( object ) {

			return ArrayBuffer.isView( object ) &&
					! ( object instanceof DataView );

		},

		// returns an array by which times and values can be sorted
		getKeyframeOrder: function ( times ) {

			function compareTime( i, j ) {

				return times[ i ] - times[ j ];

			}

			var n = times.length;
			var result = new Array( n );
			for ( var i = 0; i !== n; ++ i ) result[ i ] = i;

			result.sort( compareTime );

			return result;

		},

		// uses the array previously returned by 'getKeyframeOrder' to sort data
		sortedArray: function ( values, stride, order ) {

			var nValues = values.length;
			var result = new values.constructor( nValues );

			for ( var i = 0, dstOffset = 0; dstOffset !== nValues; ++ i ) {

				var srcOffset = order[ i ] * stride;

				for ( var j = 0; j !== stride; ++ j ) {

					result[ dstOffset ++ ] = values[ srcOffset + j ];

				}

			}

			return result;

		},

		// function for parsing AOS keyframe formats
		flattenJSON: function ( jsonKeys, times, values, valuePropertyName ) {

			var i = 1, key = jsonKeys[ 0 ];

			while ( key !== undefined && key[ valuePropertyName ] === undefined ) {

				key = jsonKeys[ i ++ ];

			}

			if ( key === undefined ) return; // no data

			var value = key[ valuePropertyName ];
			if ( value === undefined ) return; // no data

			if ( Array.isArray( value ) ) {

				do {

					value = key[ valuePropertyName ];

					if ( value !== undefined ) {

						times.push( key.time );
						values.push.apply( values, value ); // push all elements

					}

					key = jsonKeys[ i ++ ];

				} while ( key !== undefined );

			} else if ( value.toArray !== undefined ) {

				// ...assume THREE.Math-ish

				do {

					value = key[ valuePropertyName ];

					if ( value !== undefined ) {

						times.push( key.time );
						value.toArray( values, values.length );

					}

					key = jsonKeys[ i ++ ];

				} while ( key !== undefined );

			} else {

				// otherwise push as-is

				do {

					value = key[ valuePropertyName ];

					if ( value !== undefined ) {

						times.push( key.time );
						values.push( value );

					}

					key = jsonKeys[ i ++ ];

				} while ( key !== undefined );

			}

		},

		subclip: function ( sourceClip, name, startFrame, endFrame ) {

			var clip = sourceClip.clone();

			clip.name = name;

			var tracks = [];

			for ( var i = 0; i < clip.tracks.length; ++ i ) {

				var track = clip.tracks[ i ];
				var valueSize = track.getValueSize();

				if ( track.times.length - 1 < startFrame ) continue;

				track.times = this.arraySlice( track.times, startFrame, endFrame );
				track.values = this.arraySlice( track.values, startFrame * valueSize, endFrame * valueSize );

				tracks.push( track );

			}

			clip.tracks = tracks;

			// find minimum .times value across all tracks in the trimmed clip

			var minStartTime = Infinity;

			for ( var j = 0; j < clip.tracks.length; ++ j ) {

				if ( minStartTime > clip.tracks[ j ].times[ 0 ] ) {

					minStartTime = clip.tracks[ j ].times[ 0 ];

				}

			}

			// shift all tracks such that clip begins at t=0

			for ( var k = 0; k < clip.tracks.length; ++ k ) {

				clip.tracks[ k ].shift( -1 * minStartTime );

			}

			clip.resetDuration();

			return clip;

		}

	};



export { AnimationUtils };
