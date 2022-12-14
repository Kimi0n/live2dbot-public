export class ModelMesh {

  groupName: string;
  artMeshes: Array<string>;

  constructor(groupName: string, artMeshes: Array<string>) {
    this.groupName = groupName;
    this.artMeshes = artMeshes;
  }
}
