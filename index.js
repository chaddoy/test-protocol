'use strict';

// Encoding
const encoding = 'ascii';

// Constact Delimeters
const start        = '~';
const line         = '#';
const end          = '\r\n';
const messageEnder = '$';

// Buffed delimeters
const bufStart        = new Buffer( start, encoding );
const bufLine         = new Buffer( line, encoding );
const bufEnd          = new Buffer( end, encoding );
const bufMessageEnder = new Buffer( messageEnder, encoding );

function TestProtocol () {
	this.remainingBuffers = '';
}

TestProtocol.prototype.write = function () {

	var args = arguments;

	let buflen = new Buffer( String( args.length ), encoding );
	let parts = [ bufStart, buflen, bufEnd ];
	let size  = 3 + buflen.length;

	for( let i = 0; i < args.length; ++i ) {
		let arg = args[ i ];

		if( !Buffer.isBuffer( arg ) ) {
			arg = new Buffer( String( arg ) );
		}

		buflen = new Buffer( String( arg.length ), encoding );

		parts = parts.concat( [
			bufLine, buflen, bufEnd,
			arg, bufEnd
		] );

		size += 5 + buflen.length + arg.length;
	}

	// Add ender
	parts = parts.concat( [
		bufMessageEnder
	] );

	size += 1;

	return Buffer.concat( parts, size );

};

TestProtocol.prototype.getCommand = function ( data ) {
	let command = [];
	for( let i = 1; i < data.length; ) {
		command.push( data[ i ] );
		i = i + 2;
	}
	return command;
};

TestProtocol.prototype.read = function ( bufferData ) {

	let read          = [];
	let readable      = bufferData.toString( 'utf-8' );
	let readableArray = readable.split( start );

	for( let k = 0; k < readableArray.length; ++k ) {
		let readableCommand = readableArray[ k ];

		// This is for removing the '' on splittin ~
		if( readableCommand.length ) {

			if( readableCommand[ readableCommand.length - 1 ] === messageEnder ) {

				// Check if there are buffers
				if( this.remainingBuffers ) {
					readableCommand = this.remainingBuffers + readableCommand;
				}

				let readCommandArray = readableCommand.split( end );
				// Remove message ender
				readCommandArray.pop();
				let length = readCommandArray.shift();
				let command = this.getCommand( readCommandArray );
				read.push( command );

				// Clear this.remainingBuffers
				this.remainingBuffers = '';
			} else  {
				this.remainingBuffers += readableCommand;
			}

		}

	}

	return read;

};

module.exports = TestProtocol;
