# 3D-Annotator Frontend

## Development

### Setup

This project uses **[pnpm](https://pnpm.io/installation#using-corepack)** as its package manager. Please use pnpm to install, add or remove packages and to execute scripts.

This project uses **ESLint** and **Prettier** to ensure a consistent code style.
To keep this repo clean, Prettier will be run before every commit using git hooks.
The git hooks are automatically installed after running `pnpm install`.

Merging a merge request is only possible if typescript and eslint run without any errors and if the code is formatted correctly.
The latter should always be the case, if not, the git hook was not working correctly or was bypassed.

#### VS Code

For the best development experience in **VS Code** we recommend the following extensions:

-   **EditorConfig** for VS Code

    This extension sets the recommended editor settings.

-   **EsLint** for VS Code

    This extension shows eslint and formatting errors in real time.
    If a clear distinction between typescript and linter errors is preferred, the following may be added to the VS Code config file:

    ```json
    "eslint.rules.customizations": [
        {
            "rule": "*",
            "severity": "warn"
        }
    ]
    ```

    This displays all linter errors as warning.

-   **Prettier** for VS Code

    This extension adds the prettier formatter to VS Code.
    We recommend the `editor.formatOnSave` option.
    Please make sure that prettier is the default formatter for the following file extensions: js, jsx, ts, tsx, json, html and css.

-   **Code Spell Checker** for VS Code

    This extension shows spell check information.
    Spelling is also checked by the CI pipeline, so it is useful to see possible errors as soon as possible.
    If the spell checker is wrong, you may add the word to the config file (`.cspell.json`) or disable the check directly in the source file (`// spell-checker:disable-next-line`).
    Do the former if the word exists but is not yet known by the spell checker.
    Do the latter if the word does not exist or is incorrect but you are not able to change it (e.g. it is used in dependency code or there is no better alternative available).

#### Environment Variables

Environment Variables are checked before starting the dev server and before the build.
If a required variable is missing, an error is displayed and the action will be aborted.

You may set the following variables in the `.env.local` file:

-   `ANNOTATOR_3D_API_BASE_URL=http://127.0.0.1:8000/`  
    (`string` - **REQUIRED**)

    The URL of the backend. The example value is the default URL of the backend dev server.

-   `ANNOTATOR_3D_DEBUG=true`  
    (`boolean` - default: `false`)

    If `true`, debug information will be printed to the console.

-   `ANNOTATOR_3D_LOGGING_LEVEL=1`  
    (`number` - `min: 0, max: 3` - default: `0`)

    Currently not used.

-   `ANNOTATOR_3D_SHOW_STATS=false`  
    (`boolean` - default: `true`)

    Displays fps, render time and memory usage while annotating.

-   `ANNOTATOR_3D_RESET_OPFS=true`  
    (`boolean` - default: `false`)

    If `true`, all files in the origin private file system (OPFS) will be deleted on every page load.
    This variable is will be removed once the contents of the OPFS can be managed through the UI.

-   `ANNOTATOR_3D_BACKEND_VERSION=0.1.0`  
    `ANNOTATOR_3D_BACKEND_VERSION_SHA`  
    `ANNOTATOR_3D_FRONTEND_VERSION=HEAD`  
    `ANNOTATOR_3D_FRONTEND_VERSION_SHA=22797c060b4baa157e2b428d1ae5d97b9bcda48c`  
    `ANNOTATOR_3D_SERVER_VERSION`  
    `ANNOTATOR_3D_SERVER_VERSION_SHA`  
    (`string` - default: `""`)

    Set the versions of the currently used backend, frontend and server.
    This information will be logged in the console and/or shown to the user.
    They each should contain a human readable string, e.g a tag or branch name and the commit sha.

### Guidelines

-   Use classic getters/setters over JavaScript getters/setters when possible

    JavaScript getters/setters are not immediately distinguishable from class properties. When deciding if a retrieved value should be stored in a local variable or instead be accessed repeatedly, this information is critical. Furthermore JavaScript getters/setters can not be extended with optional parameters later on (e.g `getValue(options?: type)` or `setValue(value, options?: type)`);
