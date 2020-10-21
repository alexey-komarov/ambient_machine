`use strict`

const http = require('http');
const querystring = require('querystring');
const events = require('events');

function create(port) {
	const emitter = new events.EventEmitter();

	http.createServer(function(request, response) {
		if(request.method == 'POST') {
			processPost(request, response, () => {
				request.post.timestamp = Date.now();
                request.post.id = request.post.id || '0';
				emitter.emit('data', request.post);
				response.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
				response.end();
			});

			return;
		}

		response.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
		response.end();
	}).listen(port);

	return {emitter}
}

function processPost(request, response, callback) {
	var queryData = '';

	if(request.method == 'POST') {
		request.on('data', data => {
			queryData += data;

			if(queryData.length > 1e6) {
				queryData = '';
				response.writeHead(413, {'Content-Type': 'text/plain'}).end();
				request.connection.destroy();
			}
		});

		request.on('end', () => {
			request.post = querystring.parse(queryData);
			callback();
		});
	} else {
		response.writeHead(405, {'Content-Type': 'text/plain'});
		response.end();
	}
}


module.exports = {
	create: create
};
