/*
* proejct-default.ts
*
* Copyright (C) 2020 by RStudio, PBC
*
*/

import { join } from "path/mod.ts";

import { resourcePath } from "../../core/resources.ts";

import { ProjectCreate, ProjectType } from "./project-types.ts";

export const defaultProjectType: ProjectType = {
  type: "default",

  create: (title: string): ProjectCreate => {
    const supportingDir = resourcePath(join("projects", "default"));
    return {
      configTemplate: join(supportingDir, "templates", "_quarto.yml.ejs"),
      scaffold: [{
        name: title,
        content: "",
        title,
      }],
    };
  },
};
