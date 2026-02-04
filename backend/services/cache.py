"""
In-memory caching service for analytics results.
"""

from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


class CacheService:
    """
    Simple in-memory cache for storing computed analytics.
    Can be replaced with Redis for production use.
    """
    
    _instance: Optional['CacheService'] = None
    _cache: Dict[str, Dict[str, Any]] = {}
    _default_ttl: int = 300  # 5 minutes
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._cache = {}
        return cls._instance
    
    def _generate_key(self, prefix: str, params: Dict[str, Any]) -> str:
        """Generate a unique cache key from parameters."""
        # Sort params for consistent hashing
        param_str = json.dumps(params, sort_keys=True, default=str)
        param_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
        return f"{prefix}:{param_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # Check expiration
        if datetime.now() > entry['expires_at']:
            del self._cache[key]
            logger.debug(f"Cache expired: {key}")
            return None
        
        logger.debug(f"Cache hit: {key}")
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set a value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (defaults to 300)
        """
        ttl = ttl or self._default_ttl
        
        self._cache[key] = {
            'value': value,
            'expires_at': datetime.now() + timedelta(seconds=ttl),
            'created_at': datetime.now()
        }
        
        logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
    
    def delete(self, key: str):
        """Delete a specific cache entry."""
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache deleted: {key}")
    
    def clear(self):
        """Clear all cache entries."""
        self._cache = {}
        logger.info("Cache cleared")
    
    def clear_prefix(self, prefix: str):
        """Clear all cache entries with a given prefix."""
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            del self._cache[key]
        logger.info(f"Cache cleared for prefix: {prefix} ({len(keys_to_delete)} entries)")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        now = datetime.now()
        valid_entries = sum(1 for e in self._cache.values() if now < e['expires_at'])
        
        return {
            'total_entries': len(self._cache),
            'valid_entries': valid_entries,
            'expired_entries': len(self._cache) - valid_entries
        }


# Singleton instance
cache_service = CacheService()
