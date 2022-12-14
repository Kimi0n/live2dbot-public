import { ModelMesh } from "./model-mesh";

export class ModelMeshConfig {

  modelName: string;
  modelId: string;
  meshGroups: Array<ModelMesh>;

  constructor(modelName?: string, modelId?: string, meshGroups?: Array<ModelMesh>) {
    this.modelName = modelName ?? '';
    this.modelId = modelId ?? '';
    this.meshGroups = meshGroups ?? [];
  }

  addMeshGroup(m: ModelMesh) {
    this.removeMeshGroup(m.groupName);
    this.meshGroups.push(m);
  }

  removeMeshGroup(n: string) {
    this.meshGroups.forEach((group: ModelMesh, index: number) => {
      if(group.groupName == n) {
        this.meshGroups.splice(index, 1);
      }
    });

  }
}
