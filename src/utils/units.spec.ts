import { format, fromSats, fromSatsNumeric, toSats } from './units';

describe('Units util', () => {
  it('should convert from satoshis to bitcoin', () => {
    expect(fromSats('1')).toEqual('0.00000001');
    expect(fromSats('100')).toEqual('0.000001');
    expect(fromSats('100000')).toEqual('0.001');
    expect(fromSats('100000000')).toEqual('1');
    expect(fromSats('1000000001')).toEqual('10.00000001');
  });

  it('should convert from satoshis to numeric bitcoin', () => {
    expect(fromSatsNumeric('1')).toEqual(0.00000001);
    expect(fromSatsNumeric('100')).toEqual(0.000001);
    expect(fromSatsNumeric('100000')).toEqual(0.001);
    expect(fromSatsNumeric('100000000')).toEqual(1);
    expect(fromSatsNumeric('100000000000')).toEqual(1000);
  });

  it('should convert from bitcoin to satoshis', () => {
    expect(toSats(0.00000001)).toEqual('1');
    expect(toSats(0.00001)).toEqual('1000');
    expect(toSats(0.01)).toEqual('1000000');
    expect(toSats(1)).toEqual('100000000');
    expect(toSats('0.00000001')).toEqual('1');
    expect(toSats('0.00001')).toEqual('1000');
    expect(toSats('0.01')).toEqual('1000000');
    expect(toSats('1')).toEqual('100000000');
  });

  it('should format values correctly', () => {
    expect(toSats(1, true)).toEqual('100,000,000');
    expect(toSats('1', true)).toEqual('100,000,000');
    expect(format(100000000)).toEqual('100,000,000');
    expect(format('100000000')).toEqual('100,000,000');
    expect(format((null as unknown) as string)).toBeNull();
  });
});
