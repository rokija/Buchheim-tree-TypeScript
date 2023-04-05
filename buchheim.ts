// inspiration: https://llimllib.github.io/pymag-trees/
// inspiration #2 https://github.com/TamimEhsan/Drawing_Presentable_Trees_with_Javascript
export class Tree {
  label: string;
  children: Tree[];
  data?: any;

  constructor(label: string = "", children: Tree[] = [], data?: any) {
    this.label = label;
    this.children = children;
    this.data = data;
  }
}

export class DrawTree extends Tree {
  children: DrawTree[];
  tree: DrawTree | Tree | null;
  y: number;
  x: number;
  parent: DrawTree | null;
  thread: DrawTree | null;
  modifier: number;
  ancestor: this;
  change: number;
  shift: number;
  leftMostSibling: DrawTree | null;
  number: number;
  label: string;
  data: any;

  constructor(
    tree: DrawTree | Tree,
    parent: DrawTree | null = null,
    depth = 0,
    number = 1
  ) {
    super();
    this.label = tree.label;
    this.data = tree.data;
    this.x = -1;
    this.y = depth;
    this.tree = tree;
    this.children = [];

    for (let i = 0; i < tree?.children?.length; i++) {
      let newTree = new DrawTree(tree.children[i], this, depth + 1, i + 1);
      this.children.push(newTree);
    }

    this.parent = parent;
    this.thread = null;
    this.modifier = 0;
    this.ancestor = this;
    this.change = 0;
    this.shift = 0;
    this.leftMostSibling = null;
    this.number = number;
  }

  getLeftLeaf = (): DrawTree | null => {
    return this.thread || (!!this.children.length && this.children[0]) || null;
  };

  getRightLeaf = (): DrawTree | null => {
    return (
      this.thread ||
      (!!this.children.length && this.children[this.children.length - 1]) ||
      null
    );
  };

  getLeftBrother = (): DrawTree | null => {
    let leftNode: DrawTree | null = null;

    if (this.parent?.children?.length) {
      for (let node of this.parent.children) {
        if (node === this) {
          return leftNode;
        } else {
          leftNode = node;
        }
      }
    }

    return leftNode;
  };

  getLeftMostSibling = (): DrawTree | null => {
    if (
      !this.leftMostSibling &&
      this.parent &&
      this !== this.parent.children[0]
    ) {
      this.leftMostSibling = this.parent.children[0];
    }
    return this.leftMostSibling;
  };
}

const firstWalk = (leaf: DrawTree, distance = 1): DrawTree => {
  if (leaf.children.length === 0) {
    const leftBrother = leaf.getLeftBrother();

    if (leaf.getLeftMostSibling() && leftBrother) {
      leaf.x = leftBrother.x + distance;
    } else {
      leaf.x = 0;
    }
  } else {
    let defaultAncestor = leaf.children[0];

    for (let child of leaf.children) {
      firstWalk(child);
      defaultAncestor = apportion(child, defaultAncestor, distance);
    }

    executeShifts(leaf);

    const midpoint =
      (leaf.children[0].x + leaf.children[leaf.children.length - 1].x) / 2;

    let leftBrother = leaf.getLeftBrother();

    if (leftBrother) {
      leaf.x = leftBrother.x + distance;
      leaf.modifier = leaf.x - midpoint;
    } else {
      leaf.x = midpoint;
    }
  }

  return leaf;
};

// adjust x values for the subtrees if needed
// the mod (modifier) is used for that
const secondWalk = (
  tree: DrawTree,
  mod = 0,
  depth = 0,
  min: number | undefined = undefined
): number | undefined => {
  tree.x += mod;
  tree.y = depth;

  if (min === undefined || tree.x < min) {
    min = tree.x;
  }

  for (let child of tree.children) {
    min = secondWalk(child, mod + tree.modifier, depth + 1, min);
  }

  return min;
};

const thirdWalk = (tree: DrawTree, n: number) => {
  tree.x += n;

  for (let child of tree.children) {
    thirdWalk(child, n);
  }
};

const apportion = (
  leaf: DrawTree,
  defaultAncestor: DrawTree,
  distance: number
): DrawTree => {
  let leftBrother = leaf.getLeftBrother();

  if (!!leftBrother) {
    let leafInnerRight: DrawTree | null,
      leafOuterRight: DrawTree | null,
      leafInnerLeft: DrawTree | null,
      leafOuterLeft: DrawTree | null,
      shiftInnerRight: number,
      shiftOuterRight: number,
      shiftOuterLeft: number,
      shiftInnerLeft: number;

    leafInnerRight = leafOuterRight = leaf;
    leafInnerLeft = leftBrother;
    leafOuterLeft = leaf.getLeftMostSibling();

    shiftInnerRight = shiftOuterRight = leaf.modifier;
    shiftInnerLeft = leafInnerLeft?.modifier || 0;
    shiftOuterLeft = leafOuterLeft?.modifier || 0;

    while (leafInnerLeft?.getRightLeaf() && leafInnerRight?.getLeftLeaf()) {
      leafInnerLeft = leafInnerLeft.getRightLeaf();
      leafInnerRight = leafInnerRight.getLeftLeaf();
      leafOuterLeft = leafOuterLeft?.getLeftLeaf() || null;
      leafOuterRight = leafOuterRight?.getRightLeaf() || null;

      if (leafOuterRight) {
        leafOuterRight.ancestor = leaf;
      }

      const shift: number =
        (leafInnerLeft?.x || 0) +
        shiftInnerLeft -
        ((leafInnerRight?.x || 0) + shiftInnerRight) +
        distance;

      if (!!leafInnerLeft && !!leaf && shift > 0) {
        const ancestor = getAncestor(leafInnerLeft, leaf, defaultAncestor);

        if (ancestor) {
          moveSubtree(ancestor, leaf, shift);
        }

        shiftInnerRight = shiftInnerRight + shift;
        shiftOuterRight = shiftOuterRight + shift;
      }

      shiftInnerLeft += leafInnerLeft?.modifier || 0;
      shiftInnerRight += leafInnerRight?.modifier || 0;
      shiftOuterLeft += leafOuterLeft?.modifier || 0;
      shiftOuterRight += leafOuterRight?.modifier || 0;
    }
    if (
      leafInnerLeft?.getRightLeaf() &&
      !leafOuterRight?.getRightLeaf() &&
      !!leafOuterRight
    ) {
      leafOuterRight.thread = leafInnerLeft.getRightLeaf();
      leafOuterRight.modifier += shiftInnerLeft - shiftOuterRight;
    } else {
      if (
        leafInnerRight?.getLeftLeaf() &&
        !leafOuterLeft?.getLeftLeaf() &&
        !!leafOuterLeft
      ) {
        leafOuterLeft.thread = leafInnerRight.getLeftLeaf();
        leafOuterLeft.modifier += shiftInnerRight - shiftOuterLeft;
      }
      defaultAncestor = leaf;
    }
  }

  return defaultAncestor;
};

const moveSubtree = (
  leafLeft: DrawTree,
  leafRight: DrawTree,
  shift: number
) => {
  // if two subtrees are conflicting,
  // move the right one
  let subtrees = leafRight.number - leafLeft.number;

  leafRight.change -= shift / subtrees;
  leafRight.shift += shift;
  leafLeft.change += shift / subtrees;
  leafRight.x += shift;
  leafRight.modifier += shift;
};

const executeShifts = (leaf: DrawTree) => {
  let shift, change;
  shift = change = 0;

  for (let i = leaf.children.length - 1; i >= 0; i--) {
    let childLeaf = leaf.children[i];
    childLeaf.x += shift;
    childLeaf.modifier += shift;
    change += childLeaf.change;
    shift += childLeaf.shift + change;
  }
};

const getAncestor = (
  leafInnerLeft: DrawTree,
  leaf: DrawTree,
  defaultAncestor: DrawTree
): DrawTree | null => {
  if (
    leaf.parent?.children.find(
      (child: DrawTree) => child?.label === leafInnerLeft?.ancestor?.label
    )
  ) {
    return leafInnerLeft?.ancestor || null;
  } else {
    return defaultAncestor;
  }
};

export const buchheim = (tree: Tree): DrawTree => {
  const drawTree = firstWalk(new DrawTree(tree));
  const min = secondWalk(drawTree);

  if (min && min < 0) {
    thirdWalk(drawTree, -min);
  }

  return drawTree;
};

// -------------------------------------------------------
// -------------------------------------------------------
// Example usage bellow:
// To use this alghorithm you need to have a Tree like structure with nested nodes of type Tree
// create a tree like structure, transforming the data to a Tree with children nested
const transformData = (
  itemLabel: string,
  map: Map<string, any>,
  data: any
): Tree => {
  const arr: Tree[] = [];

  if (map.get(itemLabel)?.children?.length) {
    for (let child of map.get(itemLabel).children) {
      arr.push(transformData(child.itemLabel, map, { order: child.order }));
    }
  } else {
    return new Tree(itemLabel, [], data);
  }

  return new Tree(itemLabel, arr, data);
};

const mapNodeChildrenToParent = (
  map: Map<string, any>,
  parent: string,
  item: { itemLabel: string; order: number }
) => {
  const mapItem = map.get(parent);

  if (mapItem && !mapItem?.children?.includes(item.itemLabel)) {
    // set parent as the current item and itemLabel as part of it's children
    map.set(parent, {
      itemLabel: parent,
      children: [...mapItem.children, item],
    });
  } else if (!mapItem) {
    map.set(parent, { itemLabel: parent, children: [item] });
  }
};

// if the original structure has "depends_on" array of parents
// to generate tree we need to know children for each node
type Nodes = {
  depends_on: any[];
  itemLabel: string;
};

const transformToChildren = (data: Nodes[]) => {
  const treeMap = new Map();
  const root = "Root"; // there needs to be one root node, but it can be removed later if there are multiple

  data.forEach((item, i) => {
    if (item.depends_on?.length) {
      for (let parent of item.depends_on) {
        mapNodeChildrenToParent(treeMap, parent, {
          itemLabel: item.itemLabel,
          order: i + 1,
        });
      }
    } else {
      mapNodeChildrenToParent(treeMap, root, {
        itemLabel: item.itemLabel,
        order: i + 1,
      });
    }
  });

  return transformData(root, treeMap, {});
};

const data = [];
const valuesWithChildren = transformToChildren(data);
// Use treeValues to draw a tree on UI (x, y positions are provided by this algorithm)
// for example, using "reactflow" library
// https://reactflow.dev/
const treeValues = buchheim(valuesWithChildren);
