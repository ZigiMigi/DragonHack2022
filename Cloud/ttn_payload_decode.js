function decodeUplink(input) {
	return {
		data: {
			// bytes: input.bytes,
			latitude:
				((input.bytes[1] << 24) >>> 0) +
				((input.bytes[2] << 16) >>> 0) +
				((input.bytes[3] << 8) >>> 0) +
				(input.bytes[4] >>> 0),
			longitude:
				((input.bytes[6] << 24) >>> 0) +
				((input.bytes[7] << 16) >>> 0) +
				((input.bytes[8] << 8) >>> 0) +
				(input.bytes[9] >>> 0),
			altitude: 250,
			hdop: 1.5
		}
	};
}
