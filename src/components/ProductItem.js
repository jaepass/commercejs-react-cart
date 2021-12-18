import React from 'react';
import PropTypes from 'prop-types';
import stripHtml from 'string-strip-html';

const ProductItem = ({ product, onAddToCart }) => {

    const { result } = stripHtml(product.description);

  const handleAddToCart = () => {
    onAddToCart(product.id, 1);
  }

  return (
    <div className="product__card">
      <img className="product__image" src={product.image.url} alt={product.name} />
      <div className="product__info">
        <h4 className="product__name">{product.name}</h4>
        <p className="product__description">
          {/* product description stripped of html tags */}
          {result}
        </p>
        <div className="product__details">
          <p className="product__price">
            {product.price.formatted_with_symbol}
          </p>
          <button
            name="Add to cart"
            className="product__btn"
            onClick={handleAddToCart}
          >
            Quick add
          </button>
        </div>
      </div>
    </div> 
  );
};

ProductItem.propTypes = {
    product: PropTypes.object,
    handleAddToCart: PropTypes.func,
    onAddToCart: () => {},
};

export default ProductItem;