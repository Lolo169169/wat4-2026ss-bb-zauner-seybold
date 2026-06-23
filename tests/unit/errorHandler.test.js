// Unit-Tests für die zentrale Express-Error-Middleware.
// Verifiziert das Mapping Fehlerklasse -> HTTP-Status und das Response-Schema.
const errorHandler = require("../../backend/middleware/errorHandler");
const {
  AlreadyTakenError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} = require("../../backend/helper/customErrors");

describe("errorHandler middleware", () => {
  let consoleSpy;

  beforeAll(() => {
    // Die Middleware loggt absichtlich viel – im Test stummschalten.
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => consoleSpy.mockRestore());

  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const cases = [
    ["UnauthorizedError", new UnauthorizedError(), 401],
    ["ForbiddenError", new ForbiddenError("article"), 403],
    ["NotFoundError", new NotFoundError("User"), 404],
    ["FieldRequiredError (ValidationError)", new FieldRequiredError("email"), 422],
    ["AlreadyTakenError (ValidationError)", new AlreadyTakenError("email"), 422],
    ["generic Error", new Error("boom"), 500],
  ];

  test.each(cases)("%s -> HTTP %s", (_label, error, expectedStatus) => {
    const res = makeRes();

    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({
      errors: { body: [error.message] },
    });
  });
});
