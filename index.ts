import { DummyDriver, ExpressionBuilder, Generated, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, sql } from "kysely";

interface DB {
  "mz_catalog.mz_roles": MzCatalogMzRoles;
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

type Nullable<O> = {
  [K in keyof O]: O[K] | null;
};

function isOwner() {
  return (
    eb: ExpressionBuilder<DB & Record<"r", Nullable<MzCatalogMzRoles>>, "r">
  ) =>
    eb
      .or([
        eb.fn("mz_is_superuser", []),
        eb.fn("has_role", [sql.ref("current_user"), `r.oid`, sql.lit("USAGE")]),
      ])
      .$castTo<boolean>()
      .as("isOwner");
}

const query = db.selectFrom("mz_catalog.mz_roles as r").select(isOwner()).compile();
console.log(query.sql);
