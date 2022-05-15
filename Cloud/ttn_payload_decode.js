function decodeUplink(input) {
	if (input.bytes[0] === 255) {
		return {
			data: {
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
				altitude:
					(((input.bytes[11] << 24) >>> 0) +
						((input.bytes[12] << 16) >>> 0) +
						((input.bytes[13] << 8) >>> 0) +
						(input.bytes[14] >>> 0)) /
					100.0,
				hdop:
					(((input.bytes[15] << 24) >>> 0) +
						((input.bytes[16] << 16) >>> 0) +
						((input.bytes[17] << 8) >>> 0) +
						(input.bytes[18] >>> 0)) /
					10000.0
			}
		};
	} else {
		return {};
	}
}
