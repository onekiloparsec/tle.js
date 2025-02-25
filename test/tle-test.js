const expect = require('expect');
const TLEJS = require('../src/main');

const NS_PER_SEC = 1e9;

const getHRTimeDiffNS = (diff) => {
  return diff[0] * NS_PER_SEC + diff[1];
}

describe('tle.js', function(){
  let tle;
  beforeEach(() => {
    tle = new TLEJS();
  });

  const tleStr = `ISS (ZARYA)
1 25544U 98067A   17206.18396726  .00001961  00000-0  36771-4 0  9993
2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995 67660`;

  const tleArr = tleStr.split('\n');

  describe('parseTLE', () => {
    it('errors on invalid type', () => {
      expect(() => {
        tle.parseTLE(new Date());
      }).toThrow('TLE input is invalid');
    });

    describe('string', () => {
      it('parses with name', () => {
        const result = tle.parseTLE(tleStr);
        const expectedResult = {
          name: tleArr[0],
          arr: tleArr.slice(1, 3)
        };
        expect(result).toEqual(expectedResult);
      });

      it('parses without name', () => {
        const tleStr2 = `1 25544U 98067A   17206.18396726  .00001961  00000-0  36771-4 0  9993
2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995 67660`;
        const result = tle.parseTLE(tleStr2);
        const expectedResult = {
          name: 'Unknown',
          arr: tleArr.slice(1, 3)
        };

        expect(result).toEqual(expectedResult);
      });

      it('with extra spaces', () => {
        const tleStr3 = `  1 25544U 98067A   17206.18396726  .00001961  00000-0  36771-4 0  9993
               2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995 67660     `;
        const result = tle.parseTLE(tleStr3);
        const expectedResult = {
          name: 'Unknown',
          arr: tleArr.slice(1, 3)
        };

        expect(result).toEqual(expectedResult);
      });
    });
  });


  describe('getTLEEpochTimestamp', () => {
    it('1', () => {
      const result = tle.getTLEEpochTimestamp(tleStr);
      const expectedResult = 1500956694771;
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getters (auto-generated)', () => {
    it('getLineNumber1', () => {
      const result = tle.getLineNumber1(tleStr);
      const expectedResult = 1;
      expect(result).toEqual(expectedResult);
    });

    it('getLineNumber2', () => {
      const result = tle.getLineNumber2(tleStr);
      const expectedResult = 2;
      expect(result).toEqual(expectedResult);
    });

    it('getChecksum1', () => {
      const result = tle.getChecksum1(tleStr);
      const expectedResult = 3;
      expect(result).toEqual(expectedResult);
    });

    it('getChecksum2', () => {
      const result = tle.getChecksum2(tleStr);
      const expectedResult = 0;
      expect(result).toEqual(expectedResult);
    });
  });

  describe('isValidTLE', () => {
    it('validates', () => {
      const result = tle.isValidTLE(tleStr);
      const expectedResult = true;
      expect(result).toEqual(expectedResult);
    });

    it('fails to validate when checksum is bad', () => {
      const str = `ISS (ZARYA)
1 25544U 98067A   17206.18396726  .00001961  00000-0  36771-4 0  9999
2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995 67660`;
      const result = tle.isValidTLE(str);
      const expectedResult = false;
      expect(result).toEqual(expectedResult);
    });
  });

  describe('tleLineChecksum', () => {
    it('1', () => {
      const str = '1 37820U 11053A   17206.57682878  .00025514  00000-0  13004-3 0  9995';
      const result = tle.tleLineChecksum(str);
      const expectedResult = 5;
      expect(result).toEqual(expectedResult);
    });

    it('2', () => {
      const str = '2 37820  42.7593 324.6017 0020085 348.1948  81.3822 15.80564343334044';
      const result = tle.tleLineChecksum(str);
      const expectedResult = 4;
      expect(result).toEqual(expectedResult);
    });

    it('3', () => {
      const result = tle.tleLineChecksum(tleArr[1]);
      const expectedResult = 3;
      expect(result).toEqual(expectedResult);
    });

    it('4', () => {
      const result = tle.tleLineChecksum(tleArr[2]);
      const expectedResult = 0;
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSatelliteInfo', () => {
    const tleStr = `ISS (ZARYA)
1 25544U 98067A   17206.51418347  .00001345  00000-0  27503-4 0  9993
2 25544  51.6396 207.2711 0006223  72.3525  71.7719 15.54224686 67715`;

    it('Big Bear flyover', () => {
      const timestamp = 1501039265000;
      const bigBearLatLng = {
        lat: 34.243889,
        lng: -116.911389
      }
      const result = tle.getSatelliteInfo(tleStr, timestamp, bigBearLatLng.lat, bigBearLatLng.lng);
      const expectedResult = {
        lat: 34.439283990227125,
        lng: -117.47561122364522,
        azimuth: 292.8250329147109,
        elevation: 81.54520744236196,
        range: 406.80066121261547,
        height: 403.01331234690133,
        velocity: 7.675512139515791
      };
      expect(result.lat).toEqual(34.43928468167498);
      expect(result.lng).toEqual(-117.47561026844932);
      expect(result.azimuth.toFixed(7)).toEqual(292.8251393);
      expect(result.elevation.toFixed(7)).toEqual(81.5452178);
      expect(result.range).toEqual(406.8007926883391);
      expect(result.height).toEqual(403.0134527800419);
      expect(result.velocity).toEqual(7.675511980883446);
    });

    describe('memoization', () => {
      let firstRunTimeMS = 0;

      const fn = () => {
        const timestamp = 1501039268000;
        const bigBearLatLng = {
          lat: 34.243889,
          lng: -116.911389
        }
        tle.getSatelliteInfo(tleStr, timestamp, bigBearLatLng.lat, bigBearLatLng.lng);
      };

      it('1', () => {
        let timeStart = process.hrtime();
        fn();
        const firstDiff = process.hrtime(timeStart);
        const firstRunTimeNS = getHRTimeDiffNS(firstDiff);

        timeStart = process.hrtime();
        fn();
        const secondDiff = process.hrtime(timeStart)
        const secondRunTimeNS = getHRTimeDiffNS(secondDiff);

        expect(firstRunTimeNS - 100000).toBeGreaterThan(secondRunTimeNS);
      })
    });
  });

  describe('getLatLon', () => {
    const tleStr = `ISS (ZARYA)
1 25544U 98067A   17206.51418347  .00001345  00000-0  27503-4 0  9993
2 25544  51.6396 207.2711 0006223  72.3525  71.7719 15.54224686 67715`;

    it('Big Bear flyover', () => {
      const timestamp = 1501039265000;
      const result = tle.getLatLon(tleStr, timestamp);
      const expectedResult = {
        lat: 34.43928468167498,
        lng: -117.47561026844932
      };
      expect(result).toEqual(expectedResult);
    });
  });

  describe('geosynchronous orbit', () => {
    const tleStr = `ABS-3
1 24901U 97042A   17279.07057876  .00000084  00000-0  00000+0 0  9995
2 24901   5.0867  62.6208 0007858 138.4124 258.4388  0.99995119 73683`;

    it('getLatLon', () => {
      const timestamp = 1501039265000;
      const result = tle.getLatLon(tleStr, timestamp);
      const expectedResult = {
        lat: 4.353016018653351,
        lng: 129.632535483672
      };
      expect(result).toEqual(expectedResult);
    });

    it('getLastAntemeridianCrossingTimeMS', () => {
      const timestamp = 1501039265000;
      const result = tle.getLastAntemeridianCrossingTimeMS(tleStr, timestamp);
      const expectedResult = -1;
      expect(result).toEqual(expectedResult);
    });

    it('getOrbitTrack', () => {
      const timestamp = 1501039265000;
      const result = tle.getOrbitTrack(tleStr.split('\n'), timestamp, 1000);
      const expectedResult = 6001;
      expect(result.length).toEqual(expectedResult);
    });

    it('getGroundTrackLatLng', () => {
      const timestamp = 1501039265000;
      const result = tle.getGroundTrackLatLng(tleStr, 1000, timestamp);
      expect(result.length).toEqual(1);
      expect(result[0].length).toEqual(145);
    });

  });

});