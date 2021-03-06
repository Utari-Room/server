import { parseAsString } from 'parse-dont-validate';
import { RentalRange } from 'utari-common';

const parseRentalFromNumeric = (rental: string | null | undefined) =>
    parseFloat(parseAsString(rental).orElseThrowDefault('rental'));

const parseNumericFromRental = (rental: number) => `${rental}`;

const parseNullableNumericFromRental = (rental: number | undefined) =>
    rental === undefined ? undefined : parseNumericFromRental(rental);

type Undefinable<T> = { [K in keyof T]: T[K] | undefined };

const convertRentalToNumeric = ({ min, max }: Undefinable<RentalRange>) => ({
    minRental: parseNullableNumericFromRental(min),
    maxRental: parseNullableNumericFromRental(max),
});

const parseVisitCount = (visitCount: number | null) =>
    !visitCount || visitCount < 0 ? 0 : visitCount;

const parseContact = ({
    mobileNumber,
    email,
}: Readonly<{
    mobileNumber: ReadonlyArray<string> | null;
    email: ReadonlyArray<string> | null;
}>) =>
    ({
        mobileNumber: mobileNumber ?? [],
        email: email ?? [],
    } as const);

const parseRating = (rating: ReadonlyArray<number> | null) => rating ?? [];

const parseAsMinMaxRental = ({
    min,
    max,
}: Readonly<{
    min: string | null;
    max: string | null;
}>) => ({
    minRentalPerPax: parseFloat(parseAsString(min).orElseThrowDefault('min')),
    maxRentalPerPax: parseFloat(parseAsString(max).orElseThrowDefault('max')),
});

type ConvertCurrencyToNumber<T> = Omit<Readonly<T>, 'minRental' | 'maxRental'> &
    Readonly<{
        minRental: number | undefined;
        maxRental: number | undefined;
    }>;

export {
    convertRentalToNumeric,
    parseVisitCount,
    parseContact,
    parseRentalFromNumeric,
    parseRating,
    parseNullableNumericFromRental,
    parseNumericFromRental,
    parseAsMinMaxRental,
    ConvertCurrencyToNumber,
};
