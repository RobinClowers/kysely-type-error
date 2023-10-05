import {
  DummyDriver,
  ExpressionBuilder,
  Generated,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
} from "kysely";

interface DB {
  "mz_catalog.mz_roles": MzCatalogMzRoles;
  "mz_catalog.mz_sources": { id: Generated<string> };
}

interface MzCatalogMzRoles {
  id: Generated<string>;
  oid: Generated<number>;
  name: Generated<string>;
  inherit: Generated<boolean>;
}

const db = new Kysely<DB>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter();
    },
    createDriver() {
      return new DummyDriver();
    },
    createIntrospector(datbase: Kysely<unknown>) {
      return new PostgresIntrospector(datbase);
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler();
    },
  },
});

function isOwner() {
  return (eb: ExpressionBuilder<DB & { r: MzCatalogMzRoles }, "r">) =>
    eb
      .or([
        eb.fn("mz_is_superuser", []),
        eb.fn("has_role", [sql.ref("current_user"), `r.oid`, sql.lit("USAGE")]),
      ])
      .$castTo<boolean>()
      .as("isOwner");
}

const query = db
  .selectFrom("mz_catalog.mz_roles as r")
  .leftJoin("mz_catalog.mz_sources as s", "s.id", "r.id")
  .select(isOwner())
  .compile();
console.log(query.sql);
