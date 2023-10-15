import { Server } from "http";
import request from "supertest";
import server from "../server";
import { pool } from "../db";

//before all the tests, set up and tear down both the server and database

afterAll(async () => {
    server.close();
    await pool.end();
});


//test for 404


describe("404 handler", () => {
    test("responds with 404 when given bad path", async () => {
        const response = await request(server).get("/badpath");
        expect(response.statusCode).toBe(404);
    });
}
);

//test the show routes

describe("The Show Routes", () => {
    test("GET to /shows returns all shows as json with status 200", async () => {
        const response = await request(server).get("/shows");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(1000);
    });

    test("GET to /shows/:id returns a single show as json with status 200", async () => {
        const response = await request(server).get("/shows/1");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBe(1);
    }
    );

    test("GET to /shows/date/:date returns a single show as json with status 200", async () => {
        const response = await request(server).get("/shows/date/2018-12-31");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body[0].name).toBe('Roseland Theater');
    }
    );

}
);

// test the song routes

describe("The Song Routes", () => {
    test("GET to /songs returns all songs as json with status 200", async () => {
        const response = await request(server).get("/songs");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(200);
    });

    test("GET to /songs/authors/:author returns all songs by an author as json with status 200", async () => {
        const response = await request(server).get("/songs/authors/sheaffer");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(0);
    }
    );

    test("GET to /songs/:id returns a single song as json with status 200", async () => {
        const response = await request(server).get("/songs/1");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBe(1);
    }
    );

}
);

//test the venue routes

describe("The Venue Routes", () => {
    test("GET to /venues returns all venues as json with status 200", async () => {
        const response = await request(server).get("/venues");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(100);
    });

    test("GET to /venues/cities/:city.:state returns all venues in a city as json with status 200", async () => {
        const response = await request(server).get("/venues/cities/Boulder.CO");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(1);
    }
    );

    test("GET to /venues/states/:state returns all venues in a state as json with status 200", async () => {
        const response = await request(server).get("/venues/states/OR");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThan(1);
    }
    );

    test("GET to /venues/:id returns all the shows for a venue as json with status 200", async () => {
        const response = await request(server).get("/venues/2");
        expect(response.statusCode).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.length).toBeGreaterThanOrEqual(1);
    }
    );

}
);








