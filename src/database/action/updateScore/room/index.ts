import {
    computeRoomScore,
    multiAttributeDecisionModelRoom,
    MultiAttributeDecisionModelRooms,
} from '../../../../api/madm';
import {
    parseAsMinMaxRental,
    parseContact,
    parseRating,
    parseVisitCount,
} from '../../../../api/query/common';
import { parseProperties } from '../../../../api/query/room';
import { DeepNonNullable } from '../../../../util/type';
import postgreSQL, { Pool } from '../../../postgres';
import room from '../../../table/room';
import { selectMinMaxRental } from './minMaxRental.queries';
import {
    IQueryToUpdateScoreOfAllRoomParams,
    IQueryToUpdateScoreOfAllRoomResult,
    queryToUpdateScoreOfAllRoom,
} from './selectAll.queries';
import {
    IQueryToUpdateScoreOfOneRoomParams,
    queryToUpdateScoreOfOneRoom,
} from './selectOne.queries';

type Rooms = ReadonlyArray<DeepNonNullable<IQueryToUpdateScoreOfAllRoomResult>>;

const updateRoomScore = (() => {
    const transformGeneralQuery = (
        rooms: Rooms
    ): MultiAttributeDecisionModelRooms =>
        rooms.map(
            ({
                address,
                capacities,
                email,
                facilities,
                latitude,
                longitude,
                mobileNumber,
                month,
                ratings,
                remark,
                rental,
                roomId,
                roomSize,
                visitCount,
                year,
            }) => ({
                id: roomId,
                contact: parseContact({
                    mobileNumber,
                    email,
                }),
                location: {
                    address,
                    coordinate: {
                        latitude,
                        longitude,
                    },
                },
                facilities,
                remarks: {
                    remark,
                    year,
                    month,
                },
                properties: parseProperties({
                    rental,
                    capacities,
                    roomSize,
                }),
                ratings: parseRating(ratings),
                visitCount: parseVisitCount(visitCount),
            })
        );

    const parseAsRoomMinMaxRental = async () => {
        const rentals = await selectMinMaxRental.run(
            undefined,
            postgreSQL.instance.pool
        );
        if (rentals.length !== 1) {
            throw new Error(
                `Expect rental to have 1 element, got ${rentals.length} instead`
            );
        }
        const [rental] = rentals;
        if (!rental) {
            throw new Error('rental cannot be undefined');
        }
        return parseAsMinMaxRental(rental);
    };

    return {
        all: async (
            params: Readonly<IQueryToUpdateScoreOfAllRoomParams>,
            pool: Pool
        ) => {
            const rooms = multiAttributeDecisionModelRoom(
                transformGeneralQuery(
                    (await queryToUpdateScoreOfAllRoom.run(
                        params,
                        pool
                    )) as Rooms
                ),
                await parseAsRoomMinMaxRental()
            );
            const res = await Promise.all(
                rooms.map(
                    async ({ id, score }) =>
                        await room.updateScore(
                            {
                                id,
                                score,
                            },
                            postgreSQL.instance.pool
                        )
                )
            );
            if (res.length !== rooms.length) {
                throw new Error(
                    `Some update score failed, number of elements in res: ${res.length} and number of elements in rooms: ${rooms.length}`
                );
            }
        },
        one: async (
            params: Readonly<IQueryToUpdateScoreOfOneRoomParams>,
            pool: Pool
        ) => {
            const rooms = transformGeneralQuery(
                (await queryToUpdateScoreOfOneRoom.run(params, pool)) as Rooms
            );
            if (rooms.length !== 1) {
                throw new Error(
                    `Expect rooms to have 1 element, got ${rooms.length} instead`
                );
            }
            const [roomQueried] = rooms;
            if (!roomQueried) {
                throw new Error('room cannot be undefined');
            }
            const rentals = await selectMinMaxRental.run(undefined, pool);
            if (rentals.length !== 1) {
                throw new Error(
                    `Expect rental to have 1 element, got ${rentals.length} instead`
                );
            }
            const [rental] = rentals;
            if (!rental) {
                throw new Error('rental cannot be undefined');
            }
            const score = computeRoomScore(roomQueried, {
                minRentalPerPax: parseInt(rental.min ?? ''),
                maxRentalPerPax: parseInt(rental.max ?? ''),
            });
            await room.updateScore(
                {
                    id: roomQueried.id,
                    score,
                },
                postgreSQL.instance.pool
            );
        },
    };
})();

export default updateRoomScore;
