function decodeUplink(input) {
	return {
		data: {
			// bytes: input.bytes,
			latitude:
				(((input.bytes[1] << 24) >>> 0) +
					((input.bytes[2] << 16) >>> 0) +
					((input.bytes[3] << 8) >>> 0) +
					(input.bytes[4] >>> 0)) /
				100000.0,
			longitude:
				(((input.bytes[6] << 24) >>> 0) +
					((input.bytes[7] << 16) >>> 0) +
					((input.bytes[8] << 8) >>> 0) +
					(input.bytes[9] >>> 0)) /
				100000.0,
			altitude: input.bytes[11] / 100.0,
			hdop: 1.5
		}
	};
}
