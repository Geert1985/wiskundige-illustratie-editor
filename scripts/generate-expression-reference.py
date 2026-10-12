"""Independent T5a binary64 fixtures. Python stdlib only; never imports the JS engine."""
from decimal import Decimal, localcontext
from fractions import Fraction
from math import nextafter, inf, pi
from pathlib import Path
import json
import random
import struct

def bits(value):
    return struct.pack('>d', value).hex()

def round_reference(value, digits, factor):
    z = Fraction.from_float(value) / Fraction.from_float(factor) * 10 ** digits
    absolute = abs(z)
    integer = (2 * absolute.numerator + absolute.denominator) // (2 * absolute.denominator)
    if z < 0:
        integer = -integer
    result = Fraction(integer, 10 ** digits) * Fraction.from_float(factor)
    try:
        output = float(result)
    except OverflowError:
        return {'code': 'NON_FINITE_RESULT'}
    if output == 0 and result != 0:
        return {'code': 'NUMERIC_UNDERFLOW'}
    return {'expectedBits': bits(output)}

rounds = []
values = [2.5, -2.5, 1.005, -1.005, 2.675, -2.675, 1e308, 2**-1074,
          nextafter(2.5, inf), nextafter(2.5, -inf), nextafter(-2.5, inf), nextafter(-2.5, -inf)]
randomizer = random.Random(512014)
for _ in range(64):
    pattern = randomizer.getrandbits(64)
    if (pattern >> 52) & 2047 != 2047:
        values.append(struct.unpack('>d', pattern.to_bytes(8, 'big'))[0])
for value in values:
    for digits in [0, 1, 2, 10]:
        for factor in [1.0, .01, pi/180]:
            rounds.append({'value':value,'digits':digits,'factor':factor,**round_reference(value,digits,factor)})

transcendentals = []
with localcontext() as context:
    context.prec = 1200
    threshold = float(-Decimal(1075)*Decimal(2).ln())
    normal_threshold = float(-Decimal(1022)*Decimal(2).ln())
    values = [-744.0,-745.0,-746.0,-1000.0,
              nextafter(threshold,-inf),threshold,nextafter(threshold,inf),
              nextafter(normal_threshold,-inf),normal_threshold,nextafter(normal_threshold,inf)]
    for value in values:
        expected = float(Decimal.from_float(value).exp())
        transcendentals.append({'function':'exp','value':value,'expectedBits':bits(expected),
                                'code':'NUMERIC_UNDERFLOW' if expected==0 else None})
    # Independent small-angle Taylor series; not Python's platform libm sin.
    for value in [2**-1074,-2**-1074,2**-1023,-2**-1023,1e-300,-1e-300]:
        x=Decimal.from_float(value)
        expected=float(x-x**3/Decimal(6)+x**5/Decimal(120))
        transcendentals.append({'function':'sin','value':value,'expectedBits':bits(expected),'code':None})
    for value in [nextafter(1.0,-inf),1.0,nextafter(1.0,inf)]:
        expected=float(Decimal.from_float(value).ln())
        transcendentals.append({'function':'ln','value':value,'expectedBits':bits(expected),'code':None})

data={'schema':1,'oracle':'Python stdlib Fraction exact rationals; Decimal precision=1200; seed=512014',
      'rounds':rounds,'transcendentals':transcendentals}
target=Path(__file__).resolve().parents[1]/'tests'/'fixtures'/'expression-reference.json'
target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(rounds)} round fixtures; {len(transcendentals)} transcendental fixtures; {target.name}')
