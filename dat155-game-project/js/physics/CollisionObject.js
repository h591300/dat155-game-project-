
export default class CollisionObject {

    constructor(mesh) {

        this.mesh = mesh;

        this._onIntersect = null;

        this._destroy = false;

        this._dynamic = false;


    }

    dynamic(){
        this._dynamic = true;
    }

    setOnIntersectListener(listener) {
        this._onIntersect = listener.bind(this);
    }

    destroy() {
        this._destroy = true;
    }

 }