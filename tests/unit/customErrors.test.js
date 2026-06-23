// Unit-Tests für die benutzerdefinierten Fehlerklassen.
// Wichtig: Der zentrale errorHandler entscheidet per `instanceof` über den
// HTTP-Statuscode. Die Vererbungshierarchie ist daher fachlich kritisch.
const {
  AlreadyTakenError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../../backend/helper/customErrors");

describe("customErrors – messages & names", () => {
  it("ForbiddenError formats the author message", () => {
    const err = new ForbiddenError("article");
    expect(err.message).toBe("You are not the author of this article");
    expect(err.name).toBe("ForbiddenError");
  });

  it("NotFoundError formats property (+ optional suffix)", () => {
    expect(new NotFoundError("User").message).toBe("User not found ");
    expect(new NotFoundError("Article", "in feed").message).toBe(
      "Article not found in feed",
    );
  });

  it("UnauthorizedError has a fixed login message", () => {
    expect(new UnauthorizedError().message).toBe("You need to login first!");
  });

  it("FieldRequiredError formats the field name", () => {
    expect(new FieldRequiredError("email").message).toBe("email is required");
  });

  it("AlreadyTakenError formats the property", () => {
    expect(new AlreadyTakenError("username").message).toBe(
      "username already exists.. ",
    );
  });
});

describe("customErrors – inheritance (drives errorHandler status codes)", () => {
  it("all custom errors are real Error instances", () => {
    const errors = [
      new ForbiddenError("x"),
      new NotFoundError("x"),
      new UnauthorizedError(),
      new FieldRequiredError("x"),
      new AlreadyTakenError("x"),
    ];
    errors.forEach((e) => expect(e).toBeInstanceOf(Error));
  });

  it("FieldRequiredError and AlreadyTakenError are ValidationErrors (=> HTTP 422)", () => {
    expect(new FieldRequiredError("x")).toBeInstanceOf(ValidationError);
    expect(new AlreadyTakenError("x")).toBeInstanceOf(ValidationError);
  });

  it("ForbiddenError is NOT a ValidationError (=> HTTP 403, not 422)", () => {
    expect(new ForbiddenError("x")).not.toBeInstanceOf(ValidationError);
  });
});
