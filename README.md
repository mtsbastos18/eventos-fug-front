# Storia Eventos — Web

Fork multi-tenant do frontend de Eventos FUG. Nasce a partir da branch `develop`
no commit `131afe753904d6ae00ae16d28df7a8469710ac14`.

O código de origem (`front/`, branch `develop`/`main`) segue rodando em produção
para a Fundação Ulysses Guimarães e **não é afetado** por este fork. Contexto
completo: `SDD-multi-tenancy.md` na raiz do repositório de origem. Nesta primeira
fase apenas o backend (API) recebeu a fundação de multi-tenancy — o frontend
ainda não foi adaptado.

---

# Front

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
