// State Machine Library
const stateMachine = (transformation) => {
	if (typeof transformation !== 'function') {
		// TODO: SOMETHING BETTER:
		transformation = () => {};
	}
	let chan = new MessageChannel();
	let fst = chan.port1;
	let snd = chan.port2;

	snd.onmessage = (e) => {
		console.log('WORKER <- UI');
		// TODO: validate
		let {subject} = e.data;
		console.log('SUBJECT', subject);

		let [result, nextTransformation] = transformation(subject);

		let nextMessage = {result};
		console.log('NEXT TRANSFORMATION?', !!nextTransformation);
		console.log('RESULT...?', result);

		if (!nextTransformation) {
			console.log('in last branch');
			nextMessage.type = 'result';
			snd.postMessage(nextMessage);
		} else {
			// TODO: check transformation for false to allow conclusions of chain
			let nextChan = stateMachine(nextTransformation);
			nextMessage.type = 'transformation',
			nextMessage.chan = nextChan
			snd.postMessage(nextMessage, [nextChan]);
		}

		// Double lock this fellow with a second HEARD, CLOSED call from fst.
		snd.close();
	};

	return fst;
};

onmessage = (e) => {
	if (e.data && e.data.cmd === 'add_this_pair_please') {
		let chan = stateMachine(contrivedAdd);
		let nextMessage = {chan};
		postMessage(nextMessage, [chan]);
	}
}

const contrivedAdd = ([fst, snd]) => {
	console.log(fst, snd);
	if (fst === 0) {
		return [snd, false];
	} else if (snd === 0) {
		return [fst, false];
	}

	fst++
	snd--

	return [[fst, snd], contrivedAdd];
};

// TODO: Improve.
const doErr = (errMsg) => {
	let nextMessage = {
		type: 'error_message',
		message: errMsg
	};
	postMessage(nextMessage);
};

const validateMsg = (e) => {
	let {data} = e;
	if (!data || typeof data !== 'object') {
		let errMsg = 'Cannot accept any message but {cmd: "start_chain"}, please send that message instead.';
		doErr(errMsg);
		return;
	}
};
